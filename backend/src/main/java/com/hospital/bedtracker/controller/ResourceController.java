package com.hospital.bedtracker.controller;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.dto.ResourceView;
import com.hospital.bedtracker.entity.Resource;
import com.hospital.bedtracker.entity.ResourceCategory;
import com.hospital.bedtracker.entity.ResourceStatus;
import com.hospital.bedtracker.repository.ResourceRepository;
import com.hospital.bedtracker.service.RealtimeEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {
    private final ResourceRepository repository;
    private final RealtimeEventPublisher events;

    public ResourceController(ResourceRepository repository, RealtimeEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<ResourceView> getAll() {
        return repository.findAll().stream().map(ResourceView::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public ResponseEntity<ResourceView> getOne(@PathVariable Long id) {
        return repository.findById(id).map(ResourceView::from).map(ResponseEntity::ok)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found"));
    }

    @GetMapping("/shortages")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','NURSE','STAFF')")
    public List<ResourceView> getShortages() {
        return repository.findAll().stream().filter(Resource::isShortage).map(ResourceView::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceView create(@RequestBody Resource resource) {
        resource.setLastUpdated(LocalDateTime.now());
        ResourceView saved = ResourceView.from(repository.save(resource));
        events.publish(RealtimeEventPublisher.COMMAND_CENTER,
                com.hospital.bedtracker.dto.RealtimeEvent.of("RESOURCE_CREATED")
                        .with("resourceId", saved.getId()).with("name", saved.getName()));
        return saved;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','NURSE')")
    public ResponseEntity<ResourceView> update(@PathVariable Long id, @RequestBody Resource body) {
        return repository.findById(id).map(existing -> {
            existing.setName(body.getName() == null ? existing.getName() : body.getName());
            existing.setCategory(body.getCategory() == null ? existing.getCategory() : body.getCategory());
            existing.setStatus(body.getStatus() == null ? existing.getStatus() : body.getStatus());
            existing.setTotalQuantity(body.getTotalQuantity() == null ? existing.getTotalQuantity() : body.getTotalQuantity());
            existing.setAvailableQuantity(body.getAvailableQuantity() == null ? existing.getAvailableQuantity() : body.getAvailableQuantity());
            existing.setNotes(body.getNotes());
            existing.setLastUpdated(LocalDateTime.now());
            ResourceView saved = ResourceView.from(repository.save(existing));
            events.publish(RealtimeEventPublisher.COMMAND_CENTER,
                    com.hospital.bedtracker.dto.RealtimeEvent.of("RESOURCE_UPDATED")
                            .with("resourceId", saved.getId()).with("available", saved.getAvailableQuantity()));
            return ResponseEntity.ok(saved);
        }).orElseThrow();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) throw new IllegalArgumentException("Resource not found");
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Resource deleted"));
    }
}
