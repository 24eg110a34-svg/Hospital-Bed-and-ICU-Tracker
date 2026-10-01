package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.Resource;
import java.time.LocalDateTime;

public class ResourceView {
    private Long id;
    private String name;
    private String category;
    private String status;
    private Integer totalQuantity;
    private Integer availableQuantity;
    private Integer usedQuantity;
    private boolean shortage;
    private Long wardId;
    private String wardName;
    private LocalDateTime lastUpdated;
    private String notes;

    public static ResourceView from(Resource resource) {
        ResourceView view = new ResourceView();
        view.id = resource.getId();
        view.name = resource.getName();
        view.category = resource.getCategory() == null ? null : resource.getCategory().name();
        view.status = resource.getStatus() == null ? null : resource.getStatus().name();
        view.totalQuantity = resource.getTotalQuantity();
        view.availableQuantity = resource.getAvailableQuantity();
        view.usedQuantity = resource.getUsedQuantity();
        view.shortage = resource.isShortage();
        if (resource.getWard() != null) {
            view.wardId = resource.getWard().getId();
            view.wardName = resource.getWard().getName();
        }
        view.lastUpdated = resource.getLastUpdated();
        view.notes = resource.getNotes();
        return view;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getStatus() { return status; }
    public Integer getTotalQuantity() { return totalQuantity; }
    public Integer getAvailableQuantity() { return availableQuantity; }
    public Integer getUsedQuantity() { return usedQuantity; }
    public boolean isShortage() { return shortage; }
    public Long getWardId() { return wardId; }
    public String getWardName() { return wardName; }
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public String getNotes() { return notes; }
}
