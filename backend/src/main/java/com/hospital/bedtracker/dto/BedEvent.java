package com.hospital.bedtracker.dto;
import com.hospital.bedtracker.entity.BedStatus;
public class BedEvent {
    private Long bedId;
    private String bedNumber;
    private BedStatus status;
    private String message;
    private String timestamp;
    private String type = "BED_STATUS_CHANGED";
    public BedEvent() {}
    public BedEvent(Long bedId, String bedNumber, BedStatus status, String message, String timestamp) {
        this.bedId=bedId; this.bedNumber=bedNumber; this.status=status; this.message=message; this.timestamp=timestamp;
    }
    public Long getBedId() { return bedId; } public void setBedId(Long v){bedId=v;}
    public String getBedNumber() { return bedNumber; } public void setBedNumber(String v){bedNumber=v;}
    public BedStatus getStatus() { return status; } public void setStatus(BedStatus v){status=v;}
    public String getMessage() { return message; } public void setMessage(String v){message=v;}
    public String getTimestamp() { return timestamp; } public void setTimestamp(String v){timestamp=v;}
    public String getType() { return type; } public void setType(String v){type=v;}
}
