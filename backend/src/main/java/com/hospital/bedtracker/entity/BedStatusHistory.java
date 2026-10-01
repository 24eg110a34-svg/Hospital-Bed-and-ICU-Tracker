package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="bed_status_history")
public class BedStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne @JoinColumn(name = "bed_id") private Bed bed;
    private String oldStatus;
    private String newStatus;
    private String reason;
    private String actor;
    private LocalDateTime timestamp = LocalDateTime.now();
    public BedStatusHistory(){}
    public BedStatusHistory(Bed bed, String oldStatus, String newStatus, String reason, String actor){
        this.bed=bed; this.oldStatus=oldStatus; this.newStatus=newStatus; this.reason=reason; this.actor=actor;
    }
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Bed getBed(){return bed;} public void setBed(Bed v){bed=v;}
    public String getOldStatus(){return oldStatus;} public void setOldStatus(String v){oldStatus=v;}
    public String getNewStatus(){return newStatus;} public void setNewStatus(String v){newStatus=v;}
    public String getReason(){return reason;} public void setReason(String v){reason=v;}
    public String getActor(){return actor;} public void setActor(String v){actor=v;}
    public LocalDateTime getTimestamp(){return timestamp;} public void setTimestamp(LocalDateTime v){timestamp=v;}
}
