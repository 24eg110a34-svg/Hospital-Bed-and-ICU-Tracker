package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.AllocationView;
import com.hospital.bedtracker.entity.Allocation;
import com.hospital.bedtracker.repository.AllocationRepository;
import com.hospital.bedtracker.service.BedAllocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allocations")
public class AllocationController {
    private final AllocationRepository repository;
    private final BedAllocationService service;

    public AllocationController(AllocationRepository repository, BedAllocationService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<AllocationView> getAll() {
        return repository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getAllocationTime() == null) return 1;
                    if (b.getAllocationTime() == null) return -1;
                    return b.getAllocationTime().compareTo(a.getAllocationTime());
                })
                .map(AllocationView::from)
                .toList();
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<AllocationView> getActive() {
        return repository.findAll().stream()
                .filter(a -> a.getDischargeTime() == null)
                .map(AllocationView::from)
                .toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> create(@RequestParam Long patientId, @RequestParam Long bedId, Authentication auth) {
        return ResponseEntity.ok(AllocationView.from(service.allocateBed(patientId, bedId, auth.getName())));
    }

    @PostMapping("/{id}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> discharge(@PathVariable Long id) {
        service.releaseBed(id);
        return ResponseEntity.ok(Map.of("message", "Patient discharged, bed moved to CLEANING"));
    }
}
