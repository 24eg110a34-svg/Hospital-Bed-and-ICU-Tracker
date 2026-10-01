package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.entity.AuditLog;
import com.hospital.bedtracker.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {
    private final AuditService service;

    public AuditLogController(AuditService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditLog> getAll() {
        return service.getAll();
    }
}
