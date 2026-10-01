package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.entity.Notification;
import com.hospital.bedtracker.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<Notification> getAll() {
        return service.getAll();
    }

    @GetMapping("/unread")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<Notification> getUnread() {
        return service.getUnread();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Map<String, Long> getUnreadCount() {
        return service.getUnreadCounts();
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public Notification markRead(@PathVariable Long id) {
        return service.markRead(id);
    }

    @PostMapping("/read-all")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public ResponseEntity<?> markAllRead() {
        return ResponseEntity.ok(Map.of("updated", service.markAllRead()));
    }
}
