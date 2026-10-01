package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.WardView;
import com.hospital.bedtracker.entity.Hospital;
import com.hospital.bedtracker.repository.HospitalRepository;
import com.hospital.bedtracker.repository.WardRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class HospitalController {
    private final HospitalRepository hospitalRepository;
    private final WardRepository wardRepository;

    public HospitalController(HospitalRepository hospitalRepository, WardRepository wardRepository) {
        this.hospitalRepository = hospitalRepository;
        this.wardRepository = wardRepository;
    }

    @GetMapping("/hospitals")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<Hospital> getHospitals() {
        return hospitalRepository.findAll();
    }

    @GetMapping("/hospitals/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Hospital getHospital(@PathVariable Long id) {
        return hospitalRepository.findById(id).orElseThrow();
    }

    @GetMapping("/hospitals/{id}/wards")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<WardView> getWardsByHospital(@PathVariable Long id) {
        return wardRepository.findAll().stream()
                .filter(w -> w.getHospital() != null && w.getHospital().getId().equals(id))
                .map(WardView::from).toList();
    }

    @GetMapping("/wards")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<WardView> getWards() {
        return wardRepository.findAll().stream().map(WardView::from).toList();
    }

    @GetMapping("/wards/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public WardView getWard(@PathVariable Long id) {
        return WardView.from(wardRepository.findById(id).orElseThrow());
    }
}

