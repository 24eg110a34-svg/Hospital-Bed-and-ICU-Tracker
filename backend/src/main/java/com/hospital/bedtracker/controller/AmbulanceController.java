package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.Ambulance;
import com.hospital.bedtracker.repository.AmbulanceRepository;
import com.hospital.bedtracker.service.AuditService;
import com.hospital.bedtracker.service.RealtimeEventPublisher;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/ambulances")
public class AmbulanceController {
    private static final Set<String> VALID_STATUSES =
            Set.of("AVAILABLE", "EN_ROUTE", "ARRIVED", "TRANSPORTING", "MAINTENANCE");

    private final AmbulanceRepository repository;
    private final RealtimeEventPublisher events;
    private final AuditService auditService;

    public AmbulanceController(AmbulanceRepository repository, RealtimeEventPublisher events, AuditService auditService) {
        this.repository = repository;
        this.events = events;
        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<Ambulance> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public ResponseEntity<Ambulance> getOne(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElseThrow();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF','NURSE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Ambulance body, Authentication auth) {
        Ambulance ambulance = repository.findById(id).orElseThrow();
        String oldStatus = ambulance.getStatus();
        String newStatus = body.getStatus() == null ? oldStatus : body.getStatus().trim().toUpperCase();
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid ambulance status: " + body.getStatus()
                    + ". Allowed values: " + VALID_STATUSES);
        }
        ambulance.setStatus(newStatus);
        if (body.getCurrentLocation() != null) ambulance.setCurrentLocation(body.getCurrentLocation());
        if (body.getDestination() != null) ambulance.setDestination(body.getDestination());
        if (body.getEta() != null) ambulance.setEta(body.getEta());
        if (body.getPatientId() != null) ambulance.setPatientId(body.getPatientId());
        ambulance.setLastUpdated(LocalDateTime.now());
        Ambulance saved = repository.save(ambulance);

        String role = auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("STAFF");
        auditService.log(auth.getName(), role, "AMBULANCE_UPDATED", "Ambulance", id, oldStatus, newStatus);
        events.publish(RealtimeEventPublisher.AMBULANCES, RealtimeEvent.of("AMBULANCE_UPDATED")
                .with("ambulanceId", saved.getId())
                .with("vehicleNumber", saved.getVehicleNumber())
                .with("oldStatus", oldStatus)
                .with("newStatus", newStatus)
                .with("currentLocation", saved.getCurrentLocation())
                .with("eta", saved.getEta() == null ? null : saved.getEta().toString()));
        events.commandCenterUpdated("AMBULANCE_UPDATED");
        if ("ARRIVED".equals(newStatus)) {
            events.publish(RealtimeEventPublisher.NOTIFICATIONS, RealtimeEvent.of("ALERT_CREATED")
                    .with("title", "Ambulance Arrived")
                    .with("message", "Ambulance " + saved.getVehicleNumber() + " has arrived at the hospital.")
                    .with("severity", "INFO")
                    .with("category", "AMBULANCE_ARRIVAL"));
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public Ambulance create(@RequestBody Ambulance ambulance) {
        if (ambulance.getStatus() == null) ambulance.setStatus("AVAILABLE");
        if (!VALID_STATUSES.contains(ambulance.getStatus().trim().toUpperCase())) {
            throw new IllegalArgumentException("Invalid ambulance status: " + ambulance.getStatus());
        }
        ambulance.setStatus(ambulance.getStatus().trim().toUpperCase());
        ambulance.setLastUpdated(LocalDateTime.now());
        Ambulance saved = repository.save(ambulance);
        events.publish(RealtimeEventPublisher.AMBULANCES, RealtimeEvent.of("AMBULANCE_CREATED")
                .with("ambulanceId", saved.getId())
                .with("vehicleNumber", saved.getVehicleNumber())
                .with("newStatus", saved.getStatus()));
        return saved;
    }
}
