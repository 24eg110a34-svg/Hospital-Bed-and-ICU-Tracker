package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    List<Bed> findByWardId(Long wardId);
    List<Bed> findByStatus(BedStatus status);
    long countByStatus(BedStatus status);
    List<Bed> findByWardHospitalId(Long hospitalId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Bed b where b.id = :id")
    Optional<Bed> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Bed b where b.id in :ids order by b.id")
    List<Bed> findAllByIdForUpdate(@Param("ids") List<Long> ids);

    @Query("select b from Bed b where b.status = com.hospital.bedtracker.entity.BedStatus.AVAILABLE and b.ward.hospital.id = :hospitalId")
    List<Bed> findAvailableByHospital(@Param("hospitalId") Long hospitalId);
}
