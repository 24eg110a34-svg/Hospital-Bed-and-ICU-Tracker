package com.hospital.bedtracker.repository;

import com.hospital.bedtracker.entity.Patient;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    List<Patient> findByIsAdmittedFalseOrderByTriageLevelAscArrivalTimeAsc();

    List<Patient> findByIsAdmittedTrueOrderByArrivalTimeDesc();

    List<Patient> findByAdmissionStatusOrderByArrivalTimeDesc(
            String admissionStatus
    );

    List<Patient> findByTriageLevelOrderByArrivalTimeAsc(
            Integer triageLevel
    );

    List<Patient> findByAssignedWardName(String wardName);

    Optional<Patient> findByMedicalRecordNumber(String medicalRecordNumber);

    long countByAdmissionStatus(String admissionStatus);

    long countByTriageLevel(Integer triageLevel);

    @Query("""
        SELECT p
        FROM Patient p
        WHERE p.admissionStatus IN :statuses
        ORDER BY COALESCE(p.triageLevel, 99) ASC, p.arrivalTime ASC
        """)
    List<Patient> findQueueByStatuses(@Param("statuses") Collection<String> statuses);

    @Query("""
        SELECT p
        FROM Patient p
        WHERE
        (
            :search IS NULL
            OR :search = ''
            OR LOWER(p.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.medicalRecordNumber) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        AND
        (
            :status IS NULL
            OR :status = ''
            OR p.admissionStatus = :status
        )
        AND
        (
            :triageLevel IS NULL
            OR p.triageLevel = :triageLevel
        )
        AND
        (
            :startDate IS NULL
            OR p.arrivalTime >= :startDate
        )
        AND
        (
            :endDate IS NULL
            OR p.arrivalTime <= :endDate
        )
        """)
    Page<Patient> searchPatients(
            @Param("search") String search,
            @Param("status") String status,
            @Param("triageLevel") Integer triageLevel,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}