package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {}
