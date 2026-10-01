package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="notifications")
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    @Column(length=1000) private String message;
    private String type; // CRITICAL, WARNING, INFO
    private String category; // BED_AVAILABLE, NEW_CRITICAL_PATIENT etc
    @Column(name = "read_") private boolean read = false;
    private LocalDateTime createdAt = LocalDateTime.now();
    public Notification(){}
    public Notification(String title, String message, String type, String category){ this.title=title; this.message=message; this.type=type; this.category=category; }
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public String getType(){return type;} public void setType(String v){type=v;}
    public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public boolean isRead(){return read;} public void setRead(boolean v){read=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
