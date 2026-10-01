package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.BedReservationView;
import com.hospital.bedtracker.service.BedReservationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final BedReservationService service;

    public ReservationController(BedReservationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<BedReservationView> getAll() {
        return service.getAll().stream().map(BedReservationView::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','STAFF')")
    public ResponseEntity<?> reserve(@RequestParam Long bedId, @RequestParam Long patientId, Authentication auth) {
        return ResponseEntity.ok(BedReservationView.from(service.reserve(bedId, patientId, auth.getName())));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public ResponseEntity<?> confirm(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(BedReservationView.from(service.confirm(id, auth.getName())));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','STAFF')")
    public ResponseEntity<?> cancel(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(BedReservationView.from(service.cancel(id, auth.getName())));
    }
}
