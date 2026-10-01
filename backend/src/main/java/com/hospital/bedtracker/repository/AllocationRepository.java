package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.Allocation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    Optional<Allocation> findByPatientIdAndDischargeTimeIsNull(Long patientId);
    boolean existsByPatientIdAndDischargeTimeIsNull(Long patientId);
    boolean existsByBedIdAndDischargeTimeIsNull(Long bedId);
    List<Allocation> findByBedIdAndDischargeTimeIsNull(Long bedId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Allocation a where a.id = :id")
    Optional<Allocation> findByIdForUpdate(@Param("id") Long id);
}
