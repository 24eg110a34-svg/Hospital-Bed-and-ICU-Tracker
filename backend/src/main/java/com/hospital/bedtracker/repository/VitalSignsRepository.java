package com.hospital.bedtracker.repository;

import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.entity.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {
    List<VitalSigns> findByPatientOrderByRecordedAtDesc(Patient patient);

    @Query("SELECT v FROM VitalSigns v WHERE v.patient = :patient AND v.recordedAt >= :since ORDER BY v.recordedAt DESC")
    List<VitalSigns> findRecentVitals(@Param("patient") Patient patient, @Param("since") LocalDateTime since);

    @Query("SELECT v FROM VitalSigns v WHERE v.patient = :patient ORDER BY v.recordedAt DESC LIMIT 1")
    VitalSigns findLatestVitals(@Param("patient") Patient patient);
}