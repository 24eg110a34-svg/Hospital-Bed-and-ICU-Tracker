package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository public interface HospitalRepository extends JpaRepository<Hospital, Long> {}
