package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.service.CommandCenterService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/command-center")
public class CommandCenterController {
    private final CommandCenterService service;

    public CommandCenterController(CommandCenterService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Map<String, Object> stats() {
        return service.getStats();
    }
}
