package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.BedStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface BedStatusHistoryRepository extends JpaRepository<BedStatusHistory, Long> {
    List<BedStatusHistory> findByBedIdOrderByTimestampDesc(Long bedId);
    List<BedStatusHistory> findByNewStatusOrderByTimestampDesc(String newStatus);
}
