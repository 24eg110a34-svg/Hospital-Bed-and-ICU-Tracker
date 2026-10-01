package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.BedReservation;
import java.time.LocalDateTime;
import java.util.Map;

public class BedReservationView {
    private Long id;
    private Long bedId;
    private String bedNumber;
    private String wardName;
    private Long patientId;
    private String patientName;
    private String patientMrn;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private String createdBy;
    private String status;
    private long minutesRemaining;

    public static BedReservationView from(BedReservation reservation) {
        BedReservationView view = new BedReservationView();
        view.id = reservation.getId();
        view.bedId = reservation.getBed() == null ? null : reservation.getBed().getId();
        view.bedNumber = reservation.getBed() == null ? null : reservation.getBed().getBedNumber();
        view.wardName = reservation.getBed() == null || reservation.getBed().getWard() == null
                ? null : reservation.getBed().getWard().getName();
        view.patientId = reservation.getPatient() == null ? null : reservation.getPatient().getId();
        view.patientName = reservation.getPatient() == null ? null : reservation.getPatient().getFullName();
        view.patientMrn = reservation.getPatient() == null ? null : reservation.getPatient().getMedicalRecordNumber();
        view.createdAt = reservation.getCreatedAt();
        view.expiresAt = reservation.getExpiresAt();
        view.confirmedAt = reservation.getConfirmedAt();
        view.cancelledAt = reservation.getCancelledAt();
        view.createdBy = reservation.getCreatedBy();
        view.status = reservation.getStatus();
        if (reservation.getExpiresAt() != null && "ACTIVE".equals(reservation.getStatus())) {
            view.minutesRemaining = java.time.Duration.between(LocalDateTime.now(), reservation.getExpiresAt()).toMinutes();
        }
        return view;
    }

    public Long getId() { return id; }
    public Long getBedId() { return bedId; }
    public String getBedNumber() { return bedNumber; }
    public String getWardName() { return wardName; }
    public Long getPatientId() { return patientId; }
    public String getPatientName() { return patientName; }
    public String getPatientMrn() { return patientMrn; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public String getCreatedBy() { return createdBy; }
    public String getStatus() { return status; }
    public long getMinutesRemaining() { return minutesRemaining; }
}
