package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.Resource;
import com.hospital.bedtracker.entity.ResourceCategory;
import com.hospital.bedtracker.entity.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByStatus(ResourceStatus status);
    List<Resource> findByCategory(ResourceCategory category);
}
