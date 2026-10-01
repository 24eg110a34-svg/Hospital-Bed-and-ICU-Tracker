package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.entity.PatientEvent;
import com.hospital.bedtracker.repository.PatientEventRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class PatientTimelineService {
    @Autowired private PatientEventRepository eventRepo;
    @Autowired private PatientRepository patientRepo;
    public void addEvent(Long patientId, String type, String desc, String by){
        try{
            Patient p=patientRepo.findById(patientId).orElse(null);
            if(p==null) return;
            PatientEvent e=new PatientEvent(p,type,desc,by);
            eventRepo.save(e);
        }catch(Exception ex){System.out.println("Timeline log failed: "+ex.getMessage());}
    }
    public List<PatientEvent> getTimeline(Long patientId){ return eventRepo.findByPatientIdOrderByTimestampDesc(patientId); }
}
