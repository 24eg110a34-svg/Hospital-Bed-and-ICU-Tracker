package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.PatientView;
import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.entity.PatientEvent;
import com.hospital.bedtracker.entity.VitalSigns;
import com.hospital.bedtracker.service.PatientService;
import com.hospital.bedtracker.service.PatientTimelineService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientService patientService;
    private final PatientTimelineService timelineService;

    public PatientController(PatientService patientService, PatientTimelineService timelineService) {
        this.patientService = patientService;
        this.timelineService = timelineService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Page<PatientView> getAllPatients(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "50") int size,
                                            @RequestParam(defaultValue = "arrivalTime") String sortBy,
                                            @RequestParam(defaultValue = "desc") String sortDir) {
        return patientService.getPatients(page, size, sortBy, sortDir).map(PatientView::from);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> getAll() {
        return patientService.getAllPatients().stream().map(PatientView::from).toList();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Page<PatientView> searchPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer triageLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return patientService.searchPatients(search, status, triageLevel, startDate, endDate, page, size)
                .map(PatientView::from);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public ResponseEntity<PatientView> create(@RequestBody Patient patient, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(PatientView.from(patientService.createPatient(patient, auth.getName())));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public PatientView getPatient(@PathVariable Long id) {
        return PatientView.from(patientService.getPatientById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found")));
    }

    @GetMapping("/mrn/{mrn}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public PatientView getPatientByMRN(@PathVariable String mrn) {
        return PatientView.from(patientService.getPatientByMRN(mrn)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found")));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public PatientView updatePatient(@PathVariable Long id, @RequestBody Patient patient, Authentication auth) {
        return PatientView.from(patientService.updatePatient(id, patient, auth.getName()));
    }

    @PostMapping("/{id}/vitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public PatientView updateVitals(@PathVariable Long id, @RequestBody VitalSigns vitals, Authentication auth) {
        return PatientView.from(patientService.updateVitals(id, vitals, auth.getName()));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public PatientView updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return PatientView.from(patientService.updateStatus(id, body.get("status"), auth.getName()));
    }

    @PostMapping("/{id}/triage")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE')")
    public PatientView applyTriage(@PathVariable Long id, @RequestBody Map<String, Integer> body, Authentication auth) {
        return PatientView.from(patientService.applyTriage(id, body.get("triageLevel"), auth.getName()));
    }

    @GetMapping("/{id}/vitals/history")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<VitalSigns> getVitalSignsHistory(@PathVariable Long id) {
        return patientService.getVitalSignsHistory(id);
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientEvent> getTimeline(@PathVariable Long id) {
        return timelineService.getTimeline(id);
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> getWaitingQueue() {
        return patientService.getWaitingPatients().stream().map(PatientView::from).toList();
    }

    @GetMapping("/triage-queue")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> getTriageQueue() {
        return patientService.getTriageQueue().stream().map(PatientView::from).toList();
    }

    @GetMapping("/admitted")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> getAdmittedPatients() {
        return patientService.getPatientsByStatus("ADMITTED").stream().map(PatientView::from).toList();
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<PatientView> getPatientsByStatus(@PathVariable String status) {
        return patientService.getPatientsByStatus(status).stream().map(PatientView::from).toList();
    }
}
