package com.hospital.bedtracker.service;
import com.hospital.bedtracker.entity.Notification;
import com.hospital.bedtracker.repository.NotificationRepository;
import com.hospital.bedtracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    @Autowired private NotificationRepository repository;
    @Autowired private RealtimeEventPublisher events;
    @Autowired private AuditService auditService;

    @Transactional
    public Notification create(String title, String message, String type, String category) {
        Notification notification = new Notification(title, message, type, category);
        Notification saved = repository.save(notification);
        events.publish(RealtimeEventPublisher.NOTIFICATIONS,
                com.hospital.bedtracker.dto.RealtimeEvent.of("ALERT_CREATED")
                        .with("notificationId", saved.getId())
                        .with("title", saved.getTitle())
                        .with("message", saved.getMessage())
                        .with("severity", saved.getType())
                        .with("category", saved.getCategory())
                        .with("read", saved.isRead()));
        events.alertCreated(saved.getId(), title, type);
        events.commandCenterUpdated("ALERT_CREATED");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Notification> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnread() {
        return repository.findTop50ByReadFalseOrderByIdDesc();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getUnreadCounts() {
        return Map.of(
                "unread", repository.countByReadFalse(),
                "critical", repository.countByReadFalseAndType("CRITICAL"));
    }

    @Transactional
    public Notification markRead(Long id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        return repository.save(notification);
    }

    @Transactional
    public int markAllRead() {
        List<Notification> all = repository.findAll();
        int count = 0;
        for (Notification notification : all) {
            if (!notification.isRead()) {
                notification.setRead(true);
                repository.save(notification);
                count++;
            }
        }
        return count;
    }
}
