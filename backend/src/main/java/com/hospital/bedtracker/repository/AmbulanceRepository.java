package com.hospital.bedtracker.repository;
import com.hospital.bedtracker.entity.Ambulance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {}
