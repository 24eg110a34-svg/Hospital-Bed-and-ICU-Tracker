package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.BedReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository public interface BedReservationRepository extends JpaRepository<BedReservation, Long> {
    List<BedReservation> findByStatus(String status);
}
