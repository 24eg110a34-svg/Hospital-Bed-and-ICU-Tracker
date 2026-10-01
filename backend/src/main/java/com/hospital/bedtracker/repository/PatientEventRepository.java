package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.PatientEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository public interface PatientEventRepository extends JpaRepository<PatientEvent, Long> {
    List<PatientEvent> findByPatientIdOrderByTimestampDesc(Long patientId);
}
