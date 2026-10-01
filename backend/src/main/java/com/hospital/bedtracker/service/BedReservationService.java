package com.hospital.bedtracker.service;
import com.hospital.bedtracker.dto.RealtimeEvent;
import com.hospital.bedtracker.entity.*;
import com.hospital.bedtracker.repository.BedRepository;
import com.hospital.bedtracker.repository.BedReservationRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BedReservationService {
    @Autowired private BedRepository bedRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private BedReservationRepository reservationRepository;
    @Autowired private AuditService auditService;
    @Autowired private PatientTimelineService timelineService;
    @Autowired private RealtimeEventPublisher events;
    @Autowired private NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<BedReservation> getAll() {
        return reservationRepository.findAll();
    }

    @Transactional
    public BedReservation reserve(Long bedId, Long patientId, String staffId) {
        Bed bed = bedRepository.findByIdForUpdate(bedId)
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is no longer available");
        }
        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.RESERVED);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        BedReservation reservation = new BedReservation();
        reservation.setBed(bed);
        reservation.setPatient(patient);
        reservation.setCreatedBy(staffId);
        reservation.setCreatedAt(LocalDateTime.now());
        reservation.setExpiresAt(LocalDateTime.now().plusHours(2));
        reservation.setStatus("ACTIVE");
        BedReservation saved = reservationRepository.save(reservation);

        auditService.log(staffId, "STAFF", "BED_RESERVED", "Bed", bed.getId(), oldStatus.name(), "RESERVED");
        timelineService.addEvent(patientId, "RESERVATION",
                "Bed " + bed.getBedNumber() + " reserved until " + saved.getExpiresAt(), staffId);

        events.bedStatusChanged(bed, oldStatus, BedStatus.RESERVED, staffId);
        events.publish(RealtimeEventPublisher.RESERVATIONS, RealtimeEvent.of("BED_RESERVED")
                .with("reservationId", saved.getId())
                .with("bedId", bed.getId())
                .with("bedNumber", bed.getBedNumber())
                .with("patientId", patientId)
                .with("expiresAt", saved.getExpiresAt().toString()));
        events.commandCenterUpdated("BED_RESERVED");
        notificationService.create("Bed Reserved",
                "Bed " + bed.getBedNumber() + " reserved for " + patient.getFullName() + " for 2 hours.",
                "INFO", "BED_RESERVED");
        return saved;
    }

    @Transactional
    public BedReservation confirm(Long id, String staffId) {
        BedReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        if (!"ACTIVE".equals(reservation.getStatus())) {
            throw new IllegalStateException("Only ACTIVE reservations can be confirmed");
        }
        if (reservation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Reservation has expired and the bed was released");
        }
        Bed bed = bedRepository.findByIdForUpdate(reservation.getBed().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        Patient patient = reservation.getPatient();
        if (bed.getStatus() != BedStatus.RESERVED) {
            throw new IllegalStateException("Bed " + bed.getBedNumber() + " is no longer reserved");
        }

        reservation.setStatus("CONFIRMED");
        reservation.setConfirmedAt(LocalDateTime.now());
        reservationRepository.save(reservation);

        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setCurrentPatient(patient);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        patient.setAdmitted(true);
        patient.setAdmissionStatus("ADMITTED");
        patient.setAssignedBedNumber(bed.getBedNumber());
        if (bed.getWard() != null) {
            patient.setAssignedWardName(bed.getWard().getName());
        }
        patient.setUpdatedBy(staffId);
        patient.setUpdatedAt(LocalDateTime.now());
        patientRepository.save(patient);

        auditService.log(staffId, "STAFF", "RESERVATION_CONFIRMED", "BedReservation", id, "ACTIVE", "CONFIRMED");
        timelineService.addEvent(patient.getId(), "ADMISSION",
                "Reservation confirmed, admitted to bed " + bed.getBedNumber(), staffId);

        events.bedStatusChanged(bed, oldStatus, BedStatus.OCCUPIED, staffId);
        events.publish(RealtimeEventPublisher.PATIENTS, RealtimeEvent.of("PATIENT_ADMITTED")
                .with("patientId", patient.getId())
                .with("bedNumber", bed.getBedNumber()));
        events.publish(RealtimeEventPublisher.RESERVATIONS, RealtimeEvent.of("RESERVATION_CONFIRMED")
                .with("reservationId", id).with("bedId", bed.getId()));
        events.commandCenterUpdated("RESERVATION_CONFIRMED");
        return reservation;
    }

    @Transactional
    public BedReservation cancel(Long id, String staffId) {
        BedReservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));
        if (!"ACTIVE".equals(reservation.getStatus())) {
            throw new IllegalStateException("Only ACTIVE reservations can be cancelled");
        }
        Bed bed = bedRepository.findByIdForUpdate(reservation.getBed().getId())
                .orElseThrow(() -> new IllegalArgumentException("Bed not found"));
        reservation.setStatus("CANCELLED");
        reservation.setCancelledAt(LocalDateTime.now());
        reservationRepository.save(reservation);

        BedStatus oldStatus = bed.getStatus();
        bed.setStatus(BedStatus.AVAILABLE);
        bed.setLastStatusChange(LocalDateTime.now());
        bedRepository.save(bed);

        auditService.log(staffId, "STAFF", "RESERVATION_CANCELLED", "BedReservation", id, "ACTIVE", "CANCELLED");
        timelineService.addEvent(reservation.getPatient().getId(), "RESERVATION",
                "Reservation for bed " + bed.getBedNumber() + " cancelled", staffId);

        events.bedStatusChanged(bed, oldStatus, BedStatus.AVAILABLE, staffId);
        events.publish(RealtimeEventPublisher.RESERVATIONS, RealtimeEvent.of("RESERVATION_CANCELLED")
                .with("reservationId", id).with("bedId", bed.getId()));
        events.commandCenterUpdated("RESERVATION_CANCELLED");
        return reservation;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expireReservations() {
        List<BedReservation> active = reservationRepository.findByStatus("ACTIVE");
        LocalDateTime now = LocalDateTime.now();
        for (BedReservation reservation : active) {
            if (reservation.getExpiresAt() == null || reservation.getExpiresAt().isAfter(now)) {
                continue;
            }
            reservation.setStatus("EXPIRED");
            reservationRepository.save(reservation);
            Bed bed = bedRepository.findByIdForUpdate(reservation.getBed().getId()).orElse(null);
            if (bed != null && bed.getStatus() == BedStatus.RESERVED) {
                BedStatus oldStatus = bed.getStatus();
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setLastStatusChange(now);
                bedRepository.save(bed);
                events.bedStatusChanged(bed, oldStatus, BedStatus.AVAILABLE, "system");
                events.commandCenterUpdated("RESERVATION_EXPIRED");
            }
            auditService.log("system", "SYSTEM", "RESERVATION_EXPIRED", "BedReservation",
                    reservation.getId(), "ACTIVE", "EXPIRED");
            notificationService.create("Reservation Expired",
                    "Reservation #" + reservation.getId() + " expired and the bed was released.",
                    "WARNING", "RESERVATION_EXPIRED");
        }
    }
}
