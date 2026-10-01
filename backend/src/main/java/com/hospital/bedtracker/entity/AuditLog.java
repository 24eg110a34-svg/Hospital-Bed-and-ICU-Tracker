package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="audit_logs")
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String user;
    private String userRole;
    private String action;
    private String entityName;
    private Long entityId;
    private String oldValue;
    private String newValue;
    private String description;
    private LocalDateTime timestamp = LocalDateTime.now();
    public AuditLog() {}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getUser(){return user;} public void setUser(String v){user=v;}
    public String getUserRole(){return userRole;} public void setUserRole(String v){userRole=v;}
    public String getAction(){return action;} public void setAction(String v){action=v;}
    public String getEntityName(){return entityName;} public void setEntityName(String v){entityName=v;}
    public Long getEntityId(){return entityId;} public void setEntityId(Long v){entityId=v;}
    public String getOldValue(){return oldValue;} public void setOldValue(String v){oldValue=v;}
    public String getNewValue(){return newValue;} public void setNewValue(String v){newValue=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public LocalDateTime getTimestamp(){return timestamp;} public void setTimestamp(LocalDateTime v){timestamp=v;}
}
