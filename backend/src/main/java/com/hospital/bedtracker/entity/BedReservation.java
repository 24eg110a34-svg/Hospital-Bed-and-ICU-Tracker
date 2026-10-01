package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="bed_reservations")
public class BedReservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name="bed_id") private Bed bed;
    @ManyToOne @JoinColumn(name="patient_id") private Patient patient;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    private String createdBy;
    private String status; // ACTIVE, CONFIRMED, EXPIRED, CANCELLED
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    public BedReservation(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Bed getBed(){return bed;} public void setBed(Bed v){bed=v;}
    public Patient getPatient(){return patient;} public void setPatient(Patient v){patient=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime v){expiresAt=v;}
    public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public LocalDateTime getConfirmedAt(){return confirmedAt;} public void setConfirmedAt(LocalDateTime v){confirmedAt=v;}
    public LocalDateTime getCancelledAt(){return cancelledAt;} public void setCancelledAt(LocalDateTime v){cancelledAt=v;}
}
