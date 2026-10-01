package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="patient_events")
public class PatientEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name="patient_id") private Patient patient;
    private String eventType;
    private String description;
    private String createdBy;
    private LocalDateTime timestamp = LocalDateTime.now();
    public PatientEvent(){}
    public PatientEvent(Patient p, String type, String desc, String by){ this.patient=p; this.eventType=type; this.description=desc; this.createdBy=by; this.timestamp=LocalDateTime.now();}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Patient getPatient(){return patient;} public void setPatient(Patient v){patient=v;}
    public String getEventType(){return eventType;} public void setEventType(String v){eventType=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public String getCreatedBy(){return createdBy;} public void setCreatedBy(String v){createdBy=v;}
    public LocalDateTime getTimestamp(){return timestamp;} public void setTimestamp(LocalDateTime v){timestamp=v;}
}
