package com.hospital.bedtracker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RealtimeEvent {
    private String type;
    private String timestamp;
    private final Map<String, Object> data = new HashMap<>();

    public RealtimeEvent() {}

    public RealtimeEvent(String type) {
        this.type = type;
        this.timestamp = LocalDateTime.now().toString();
    }

    public static RealtimeEvent of(String type) { return new RealtimeEvent(type); }

    public RealtimeEvent with(String key, Object value) {
        data.put(key, value);
        return this;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public Map<String, Object> getData() { return data; }
}
