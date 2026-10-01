package com.hospital.bedtracker.service;

import com.hospital.bedtracker.dto.BedEligibilityDTO;
import com.hospital.bedtracker.entity.Bed;
import com.hospital.bedtracker.entity.BedStatus;
import com.hospital.bedtracker.entity.BedType;
import com.hospital.bedtracker.entity.Hospital;
import com.hospital.bedtracker.entity.Patient;
import com.hospital.bedtracker.entity.Ward;
import com.hospital.bedtracker.repository.AllocationRepository;
import com.hospital.bedtracker.repository.BedRepository;
import com.hospital.bedtracker.repository.BedStatusHistoryRepository;
import com.hospital.bedtracker.repository.PatientEventRepository;
import com.hospital.bedtracker.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BedAllocationService eligibility scoring")
class BedAllocationServiceEligibilityTest {

    @Mock private BedRepository bedRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private AllocationRepository allocationRepository;
    @Mock private BedStatusHistoryRepository bedStatusHistoryRepository;
    @Mock private PatientEventRepository patientEventRepository;
    @Mock private AuditService auditService;
    @Mock private PatientTimelineService patientTimelineService;
    @Mock private RealtimeEventPublisher events;
    @Mock private NotificationService notificationService;

    @InjectMocks private BedAllocationService service;

    private static final Hospital HOSPITAL = hospital(1L, "City General");

    @BeforeEach
    void setUp() {
        lenient().when(allocationRepository.existsByBedIdAndDischargeTimeIsNull(anyLong()))
                .thenReturn(false);
        lenient().when(allocationRepository.existsByPatientIdAndDischargeTimeIsNull(anyLong()))
                .thenReturn(false);
    }

    private static Hospital hospital(Long id, String name) {
        Hospital h = new Hospital();
        h.setId(id);
        h.setName(name);
        return h;
    }

    private static Ward ward(String wardType) {
        Ward w = new Ward();
        w.setId(100L);
        w.setName(wardType + " Ward");
        w.setWardType(wardType);
        w.setHospital(HOSPITAL);
        return w;
    }

    private static Bed bed(Long id, String number, BedStatus status, BedType type, String wardType) {
        Bed b = new Bed();
        b.setId(id);
        b.setBedNumber(number);
        b.setStatus(status);
        b.setBedType(type);
        b.setWard(ward(wardType));
        return b;
    }

    private static Bed availableBed(String wardType) {
        return bed(1L, "B-1", BedStatus.AVAILABLE, BedType.GENERAL, wardType);
    }

    private static Patient patient(Integer triageLevel) {
        Patient p = new Patient();
        p.setId(500L);
        p.setFullName("Test Patient");
        p.setMedicalRecordNumber("MRN-TEST");
        p.setTriageLevel(triageLevel);
        p.setAdmissionStatus("WAITING_FOR_BED");
        p.setHospital(HOSPITAL);
        p.setRequiresVentilator(Boolean.FALSE);
        p.setRequiresOxygen(Boolean.FALSE);
        p.setRequiresIsolation(Boolean.FALSE);
        p.setRequiresDialysis(Boolean.FALSE);
        p.setRequiresCardiacMonitor(Boolean.FALSE);
        return p;
    }

    @Nested
    @DisplayName("hard blockers make a bed ineligible")
    class Blockers {

        @Test
        @DisplayName("bed that is not AVAILABLE")
        void nonAvailableBedIsBlocked() {
            Patient p = patient(3);
            Bed b = bed(1L, "ER-9", BedStatus.CLEANING, BedType.GENERAL, "GENERAL");

            BedEligibilityDTO dto = service.evaluate(p, b);

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).contains("Bed status is CLEANING");
        }

        @Test
        @DisplayName("bed with an active allocation")
        void activeAllocationBlocksBed() {
            when(allocationRepository.existsByBedIdAndDischargeTimeIsNull(1L)).thenReturn(true);

            BedEligibilityDTO dto = service.evaluate(patient(3), availableBed("GENERAL"));

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).contains("active allocation");
        }

        @Test
        @DisplayName("bed type does not satisfy the patient's required type")
        void bedTypeMismatchBlocks() {
            Patient p = patient(3);
            p.setRequiredBedType(BedType.ICU);

            BedEligibilityDTO dto = service.evaluate(p, availableBed("GENERAL"));

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).contains("Requires ICU bed type");
        }

        @Test
        @DisplayName("missing clinical capability")
        void missingCapabilityBlocks() {
            assertThat(service.evaluate(patientNeeding(true, false, false, false, false),
                    plainBed()).isEligible()).isFalse();
            assertThat(service.evaluate(patientNeeding(false, true, false, false, false),
                    plainBed()).isEligible()).isFalse();
            assertThat(service.evaluate(patientNeeding(false, false, true, false, false),
                    plainBed()).isEligible()).isFalse();
            assertThat(service.evaluate(patientNeeding(false, false, false, true, false),
                    plainBed()).isEligible()).isFalse();
            assertThat(service.evaluate(patientNeeding(false, false, false, false, true),
                    plainBed()).isEligible()).isFalse();
        }

        @ParameterizedTest(name = "requires {0} and bed lacks it -> blocker")
        @CsvSource({"ventilator", "oxygen", "isolation", "dialysis", "cardiacMonitor"})
        @DisplayName("each unmet requirement names itself in the reason")
        void blockerReasonIsSpecific(String requirement) {
            Patient p = switch (requirement) {
                case "ventilator" -> patientNeeding(true, false, false, false, false);
                case "oxygen" -> patientNeeding(false, true, false, false, false);
                case "isolation" -> patientNeeding(false, false, true, false, false);
                case "dialysis" -> patientNeeding(false, false, false, true, false);
                default -> patientNeeding(false, false, false, false, true);
            };

            BedEligibilityDTO dto = service.evaluate(p, plainBed());

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).containsIgnoringCase("requires");
        }

        @Test
        @DisplayName("bed belonging to another hospital")
        void crossHospitalBedIsBlocked() {
            Bed b = availableBed("GENERAL");
            Hospital other = hospital(2L, "Other Hospital");
            Ward w = new Ward();
            w.setId(200L);
            w.setName("Foreign Ward");
            w.setWardType("GENERAL");
            w.setHospital(other);
            b.setWard(w);

            BedEligibilityDTO dto = service.evaluate(patient(3), b);

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).contains("different hospital");
        }

        private Bed plainBed() {
            return bed(9L, "GEN-1", BedStatus.AVAILABLE, BedType.GENERAL, "GENERAL");
        }

        private Patient patientNeeding(boolean vent, boolean oxy, boolean iso, boolean dial, boolean cardiac) {
            Patient p = patient(3);
            p.setRequiresVentilator(vent);
            p.setRequiresOxygen(oxy);
            p.setRequiresIsolation(iso);
            p.setRequiresDialysis(dial);
            p.setRequiresCardiacMonitor(cardiac);
            return p;
        }
    }

    @Nested
    @DisplayName("ward-type routing")
    class WardRouting {

        @Test
        @DisplayName("matching required ward type adds 60 and explains why")
        void matchingWardTypeScores() {
            Patient p = patient(3);
            p.setRequiredWardType("EMERGENCY");

            BedEligibilityDTO dto = service.evaluate(p, availableBed("EMERGENCY"));

            assertThat(dto.isEligible()).isTrue();
            assertThat(dto.getScore()).isEqualTo(60);
            assertThat(dto.getReason()).contains("Ward type matches required EMERGENCY");
            assertThat(dto.getScoreLabel()).isEqualTo("SUITABLE");
        }

        @Test
        @DisplayName("mismatched required ward type blocks rather than merely scoring low")
        void mismatchedWardTypeBlocks() {
            Patient p = patient(3);
            p.setRequiredWardType("ICU");

            BedEligibilityDTO dto = service.evaluate(p, availableBed("GENERAL"));

            assertThat(dto.isEligible()).isFalse();
            assertThat(dto.getReason()).contains("Requires ward type ICU");
        }

        @Test
        @DisplayName("level 1 critical patient is pushed to ICU")
        void criticalPatientPrefersIcu() {
            Patient p = patient(1);

            BedEligibilityDTO inIcu = service.evaluate(p, availableBed("ICU"));
            BedEligibilityDTO inGeneral = service.evaluate(p, availableBed("GENERAL"));

            assertThat(inIcu.isEligible()).isTrue();
            assertThat(inIcu.getScore()).isEqualTo(100);
            assertThat(inGeneral.isEligible()).isFalse();
            assertThat(inGeneral.getReason()).contains("should be placed in ICU");
        }

        @Test
        @DisplayName("level 2 emergency patient accepts any acute ward")
        void emergencyPatientAcceptsAcuteWards() {
            Patient p = patient(2);

            assertThat(service.evaluate(p, availableBed("EMERGENCY")).isEligible()).isTrue();
            assertThat(service.evaluate(p, availableBed("ICU")).isEligible()).isTrue();
            assertThat(service.evaluate(p, availableBed("HDU")).isEligible()).isTrue();
        }

        @Test
        @DisplayName("stable patient is steered away from scarce ICU capacity")
        void stablePatientConservesIcu() {
            Patient p = patient(5);

            BedEligibilityDTO inIcu = service.evaluate(p, availableBed("ICU"));
            BedEligibilityDTO inGeneral = service.evaluate(p, availableBed("GENERAL"));

            assertThat(inIcu.isEligible()).isTrue();
            assertThat(inIcu.getScore()).isNegative();
            assertThat(inIcu.getScoreLabel()).isEqualTo("POOR_MATCH");
            assertThat(inGeneral.getScore()).isEqualTo(30);
        }
    }

    @Nested
    @DisplayName("capability bonuses and score labels")
    class Scoring {

        @Test
        @DisplayName("capable beds earn bonuses without becoming required")
        void capableBedsScoreHigher() {
            Patient p = patient(5);
            Bed basic = availableBed("GENERAL");
            Bed equipped = availableBed("GENERAL");
            equipped.setHasVentilator(true);
            equipped.setHasOxygen(true);
            equipped.setHasCardiacMonitor(true);

            int basicScore = service.evaluate(p, basic).getScore();
            int equippedScore = service.evaluate(p, equipped).getScore();

            assertThat(equippedScore).isEqualTo(basicScore + 35);
        }

        @Test
        @DisplayName("fully equipped ICU bed receives the extra 5 point bonus")
        void equippedIcuGetsBonus() {
            Patient p = patient(5);
            Bed icu = bed(1L, "ICU-1", BedStatus.AVAILABLE, BedType.ICU, "ICU");
            icu.setHasVentilator(true);
            icu.setHasOxygen(true);

            BedEligibilityDTO dto = service.evaluate(p, icu);

            assertThat(dto.getScore()).isEqualTo(-70 + 15 + 10 + 5);
            assertThat(dto.getScoreLabel()).isEqualTo("POOR_MATCH");
        }

        @Test
        @DisplayName("patient with no requirements and no ward preference still matches")
        void bareMinimumIsEligible() {
            BedEligibilityDTO dto = service.evaluate(patient(3), availableBed("GENERAL"));

            assertThat(dto.isEligible()).isTrue();
            assertThat(dto.getReason()).contains("General/emergency bed is appropriate");
        }

        @Test
        @DisplayName("feature list reflects what the bed actually has")
        void featuresDescribeBed() {
            Bed b = availableBed("ICU");
            b.setHasVentilator(true);
            b.setIsIsolation(true);

            BedEligibilityDTO dto = service.evaluate(patient(5), b);

            assertThat(dto.getFeatures()).contains("Ventilator").contains("Isolation");
        }
    }

    @Nested
    @DisplayName("ranking")
    class Ranking {

        @Test
        @DisplayName("eligible beds first, then by descending score, then bed number")
        void resultsAreRanked() {
            Patient p = patient(1);

            Bed blocked = bed(3L, "GEN-3", BedStatus.OCCUPIED, BedType.GENERAL, "GENERAL");
            Bed mediocre = availableBed("GENERAL");
            mediocre.setBedNumber("GEN-1");
            Bed best = bed(1L, "ICU-1", BedStatus.AVAILABLE, BedType.ICU, "ICU");
            best.setHasVentilator(true);
            best.setHasOxygen(true);

            when(patientRepository.findById(500L)).thenReturn(Optional.of(p));
            when(bedRepository.findAll()).thenReturn(java.util.List.of(blocked, mediocre, best));

            var ranked = service.checkEligibility(500L);

            assertThat(ranked).hasSize(3);
            assertThat(ranked.get(0).getBedNumber()).isEqualTo("ICU-1");
            assertThat(ranked.get(1).getBedNumber()).isEqualTo("GEN-1");
            assertThat(ranked.get(2).getBedNumber()).isEqualTo("GEN-3");
            assertThat(ranked.get(2).isEligible()).isFalse();
        }

        @Test
        @DisplayName("patient who already holds a bed cannot be matched again")
        void activeAllocationBlocksFurtherMatching() {
            when(patientRepository.findById(500L)).thenReturn(Optional.of(patient(3)));
            when(allocationRepository.existsByPatientIdAndDischargeTimeIsNull(500L)).thenReturn(true);

            org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                    () -> service.checkEligibility(500L));
        }
    }
}
