package com.hospital.bedtracker.dto;

public class BedEligibilityDTO {
    private Long bedId;
    private String bedNumber;
    private boolean eligible;
    private String reason;
    private Integer score;
    private String scoreLabel;
    private String bedType;
    private String wardType;
    private String wardName;
    private String status;
    private String features;

    public BedEligibilityDTO() {}

    public BedEligibilityDTO(Long bedId, String bedNumber, boolean eligible, String reason) {
        this.bedId = bedId;
        this.bedNumber = bedNumber;
        this.eligible = eligible;
        this.reason = reason;
    }

    public Long getBedId() { return bedId; }
    public void setBedId(Long bedId) { this.bedId = bedId; }
    public String getBedNumber() { return bedNumber; }
    public void setBedNumber(String bedNumber) { this.bedNumber = bedNumber; }
    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public String getScoreLabel() { return scoreLabel; }
    public void setScoreLabel(String scoreLabel) { this.scoreLabel = scoreLabel; }
    public String getBedType() { return bedType; }
    public void setBedType(String bedType) { this.bedType = bedType; }
    public String getWardType() { return wardType; }
    public void setWardType(String wardType) { this.wardType = wardType; }
    public String getWardName() { return wardName; }
    public void setWardName(String wardName) { this.wardName = wardName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
}
