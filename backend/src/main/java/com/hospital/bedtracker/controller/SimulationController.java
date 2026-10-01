package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.service.SimulationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@PreAuthorize("hasRole('ADMIN')")
public class SimulationController {
    private final SimulationService service;

    public SimulationController(SimulationService service) {
        this.service = service;
    }

    @PostMapping("/emergency-patient")
    public ResponseEntity<?> emergencyPatient() {
        return ResponseEntity.ok(service.emergencyPatient());
    }

    @PostMapping("/occupy-bed")
    public ResponseEntity<?> occupyBed() {
        return ResponseEntity.ok(service.occupyRandomBed());
    }

    @PostMapping("/reserve-bed")
    public ResponseEntity<?> reserveBed() {
        return ResponseEntity.ok(service.reserveRandomBed());
    }

    @PostMapping("/discharge-patient")
    public ResponseEntity<?> dischargePatient() {
        return ResponseEntity.ok(service.dischargeRandomPatient());
    }

    @PostMapping("/clean-bed")
    public ResponseEntity<?> cleanBed() {
        return ResponseEntity.ok(service.startCleaningRandomBed());
    }

    @PostMapping("/ambulance-arrival")
    public ResponseEntity<?> ambulanceArrival() {
        return ResponseEntity.ok(service.ambulanceArrival());
    }
}
