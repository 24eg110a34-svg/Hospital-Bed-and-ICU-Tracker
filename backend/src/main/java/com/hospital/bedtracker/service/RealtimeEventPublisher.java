package com.hospital.bedtracker.service;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.Bed;
import com.hospital.bedtracker.entity.BedStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class RealtimeEventPublisher {
    public static final String BEDS = "/topic/beds";
    public static final String PATIENTS = "/topic/patients";
    public static final String ALLOCATIONS = "/topic/allocations";
    public static final String RESERVATIONS = "/topic/reservations";
    public static final String AMBULANCES = "/topic/ambulances";
    public static final String COMMAND_CENTER = "/topic/command-center";
    public static final String NOTIFICATIONS = "/topic/notifications";

    @Autowired private SimpMessagingTemplate messagingTemplate;

    public void publish(String topic, RealtimeEvent event) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            messagingTemplate.convertAndSend(topic, event);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend(topic, event);
            }
        });
    }

    public void bedStatusChanged(Bed bed, BedStatus oldStatus, BedStatus newStatus, String actor) {
        publish(BEDS, RealtimeEvent.of(eventTypeFor(oldStatus, newStatus))
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber())
                .with("bedType", bed.getBedType() == null ? null : bed.getBedType().name())
                .with("wardId", bed.getWard() == null ? null : bed.getWard().getId())
                .with("wardName", bed.getWard() == null ? null : bed.getWard().getName())
                .with("hospitalId", bed.getWard() == null || bed.getWard().getHospital() == null ? null : bed.getWard().getHospital().getId())
                .with("oldStatus", oldStatus == null ? null : oldStatus.name())
                .with("newStatus", newStatus.name())
                .with("status", newStatus.name())
                .with("currentPatientId", bed.getCurrentPatient() == null ? null : bed.getCurrentPatient().getId())
                .with("currentPatientName", bed.getCurrentPatient() == null ? null : bed.getCurrentPatient().getFullName())
                .with("lastStatusChange", bed.getLastStatusChange() == null ? null : bed.getLastStatusChange().toString())
                .with("actor", actor));
    }

    public void commandCenterUpdated(String reason) {
        publish(COMMAND_CENTER, RealtimeEvent.of("COMMAND_CENTER_UPDATED").with("reason", reason));
    }

    public void alertCreated(Long notificationId, String title, String type) {
        publish(NOTIFICATIONS, RealtimeEvent.of("ALERT_CREATED")
                .with("notificationId", notificationId)
                .with("title", title)
                .with("alertType", type));
    }

    private String eventTypeFor(BedStatus oldStatus, BedStatus newStatus) {
        if (newStatus == BedStatus.RESERVED) return "BED_RESERVED";
        if (newStatus == BedStatus.OCCUPIED) return oldStatus == BedStatus.RESERVED ? "BED_ALLOCATED" : "BED_STATUS_CHANGED";
        if (newStatus == BedStatus.CLEANING) return "BED_CLEANING";
        if (newStatus == BedStatus.AVAILABLE) return "BED_AVAILABLE";
        if (newStatus == BedStatus.BLOCKED) return "BED_BLOCKED";
        return "BED_STATUS_CHANGED";
    }
}
