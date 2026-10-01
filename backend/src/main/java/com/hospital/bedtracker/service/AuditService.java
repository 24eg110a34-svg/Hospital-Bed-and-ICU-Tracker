package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.AuditLog;
import com.hospital.bedtracker.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
@Service
public class AuditService {
    @Autowired private AuditLogRepository repo;
    public void log(String user, String role, String action, String entity, Long entityId, String oldVal, String newVal){
        try{
            AuditLog a=new AuditLog();
            a.setUser(user); a.setUserRole(role); a.setAction(action); a.setEntityName(entity); a.setEntityId(entityId);
            a.setOldValue(oldVal); a.setNewValue(newVal);
            a.setDescription(user+" "+action+" "+entity+" "+entityId);
            a.setTimestamp(LocalDateTime.now());
            repo.save(a);
        }catch(Exception e){ System.out.println("Audit log failed: "+e.getMessage());}
    }
    public java.util.List<AuditLog> getAll(){ return repo.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,"timestamp"));}
}
