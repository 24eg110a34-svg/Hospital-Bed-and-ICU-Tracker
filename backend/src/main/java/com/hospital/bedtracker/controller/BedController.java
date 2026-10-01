package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.AllocationView;
import com.hospital.bedtracker.dto.BedView;
import com.hospital.bedtracker.dto.PatientView;
import com.hospital.bedtracker.dto.WardView;
import com.hospital.bedtracker.entity.Bed;
import com.hospital.bedtracker.entity.BedStatus;
import com.hospital.bedtracker.entity.BedStatusHistory;
import com.hospital.bedtracker.service.BedAllocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
public class BedController {
    private final BedAllocationService allocationService;

    public BedController(BedAllocationService allocationService) {
        this.allocationService = allocationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<BedView> getAll() {
        return allocationService.listBeds().stream().map(BedView::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public BedView getById(@PathVariable Long id) {
        return BedView.from(allocationService.requireBed(id));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<BedView> getAvailable() {
        return allocationService.listAvailableBeds().stream().map(BedView::from).toList();
    }

    @GetMapping("/ward/{wardId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<BedView> getByWard(@PathVariable Long wardId) {
        return allocationService.listBeds().stream()
                .filter(b -> b.getWard() != null && b.getWard().getId().equals(wardId))
                .map(BedView::from).toList();
    }

    @GetMapping("/eligibility/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public Object getEligibility(@PathVariable Long patientId) {
        return allocationService.buildEligibilityResponse(patientId);
    }

    @PostMapping("/allocate")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> allocate(@RequestParam Long patientId, @RequestParam Long bedId, Authentication auth) {
        return ResponseEntity.ok(AllocationView.from(allocationService.allocateBed(patientId, bedId, auth.getName())));
    }

    @PostMapping("/release")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> release(@RequestParam Long allocationId) {
        allocationService.releaseBed(allocationId);
        return ResponseEntity.ok(Map.of("message", "Patient discharged and bed moved to CLEANING"));
    }

    @PostMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE')")
    public ResponseEntity<?> markAvailable(@RequestParam Long bedId) {
        allocationService.markAvailable(bedId);
        return ResponseEntity.ok(Map.of("message", "Bed is now available"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        String rawStatus = body.get("status");
        BedStatus newStatus;
        try {
            newStatus = BedStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid bed status: " + rawStatus);
        }
        String role = auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("STAFF");
        allocationService.changeStatus(id, newStatus, body.get("notes"), auth.getName(), role);
        return ResponseEntity.ok(Map.of("message", "Bed status updated to " + newStatus, "bedId", id, "status", newStatus.name()));
    }

    @GetMapping("/{id}/suitable-patients")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> findSuitablePatients(@PathVariable Long id) {
        return allocationService.findSuitablePatients(id);
    }

    @PostMapping("/{id}/allocate-patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> allocatePatient(@PathVariable Long id, @PathVariable Long patientId, Authentication auth) {
        return ResponseEntity.ok(allocationService.allocatePatientToBed(patientId, id, auth.getName()));
    }

    @PostMapping("/{id}/discharge")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public ResponseEntity<?> dischargeToCleaning(@PathVariable Long id, Authentication auth) {
        List<com.hospital.bedtracker.entity.Allocation> active = allocationService.getActiveAllocationsForBed(id);
        if (active.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No active allocation for this bed"));
        }
        return ResponseEntity.ok(allocationService.dischargeToCleaning(active.get(0).getId(), auth.getName()));
    }

    @PostMapping("/{id}/complete-cleaning")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE')")
    public ResponseEntity<?> completeCleaning(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(allocationService.completeCleaning(id, auth.getName()));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<BedStatusHistory> getBedHistory(@PathVariable Long id) {
        return allocationService.getBedHistory(id);
    }
}
