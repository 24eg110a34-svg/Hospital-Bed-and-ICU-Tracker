package com.hospital.bedtracker.config;

import com.hospital.bedtracker.entity.Bed;
import com.hospital.bedtracker.entity.BedStatus;
import com.hospital.bedtracker.entity.BedType;
import com.hospital.bedtracker.entity.Hospital;
import com.hospital.bedtracker.entity.Ward;
import com.hospital.bedtracker.repository.BedRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BedCapabilityPatcher")
class BedCapabilityPatcherTest {

    @Mock private BedRepository bedRepository;

    private BedCapabilityPatcher patcher;

    @BeforeEach
    void setUp() {
        patcher = new BedCapabilityPatcher(bedRepository);
    }

    private Bed bed(String number, String wardType, String wardName) {
        Hospital h = new Hospital();
        h.setId(1L);
        Ward w = new Ward();
        w.setId(1L);
        w.setName(wardName);
        w.setWardType(wardType);
        w.setHospital(h);

        Bed b = new Bed();
        b.setId((long) Math.abs((number + wardType).hashCode() % 10000) + 1);
        b.setBedNumber(number);
        b.setStatus(BedStatus.AVAILABLE);
        b.setBedType(BedType.GENERAL);
        b.setWard(w);
        return b;
    }

    private Map<String, Bed> runAndCapture(List<Bed> beds) {
        org.mockito.Mockito.when(bedRepository.findAll()).thenReturn(beds);
        ArgumentCaptor<Bed> captor = ArgumentCaptor.forClass(Bed.class);
        patcher.run();
        verify(bedRepository, org.mockito.Mockito.atLeast(0)).save(captor.capture());
        return captor.getAllValues().stream()
                .collect(Collectors.toMap(Bed::getBedNumber, Function.identity(), (a, b) -> a));
    }

    @Test
    @DisplayName("ICU beds can take a dialysis, ventilator and oxygen patient")
    void icuBedsAreFullyEquipped() {
        Bed icu1 = bed("ICU-1", "ICU", "ICU - Critical Care");

        Map<String, Bed> saved = runAndCapture(List.of(icu1));

        Bed fixed = saved.get("ICU-1");
        assertThat(fixed.isHasDialysis()).isTrue();
        assertThat(fixed.isHasVentilator()).isTrue();
        assertThat(fixed.isHasOxygen()).isTrue();
        assertThat(fixed.isHasCardiacMonitor()).isTrue();
    }

    @Test
    @DisplayName("at least two ICU beds are isolation capable")
    void someIcuBedsAreIsolationCapable() {
        List<Bed> icuBeds = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            icuBeds.add(bed("ICU-" + i, "ICU", "ICU - Critical Care"));
        }

        Map<String, Bed> saved = runAndCapture(icuBeds);

        long isolationIcu = saved.values().stream().filter(Bed::isIsolation).count();
        assertThat(isolationIcu).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("Isolation Ward beds carry the isolation flag")
    void isolationWardBedsAreIsolationCapable() {
        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            beds.add(bed("ISO-" + i, "ISOLATION", "Isolation Ward"));
        }

        Map<String, Bed> saved = runAndCapture(beds);

        assertThat(saved.values()).allMatch(Bed::isIsolation);
    }

    @Test
    @DisplayName("general wards have oxygen on most beds and some ventilators and dialysis")
    void generalWardIsRealisticallyEquipped() {
        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            beds.add(bed("GEN-" + i, "GENERAL", "General Ward"));
        }

        Map<String, Bed> saved = runAndCapture(beds);

        assertThat(saved.values()).anyMatch(Bed::isHasOxygen);
        assertThat(saved.values()).anyMatch(Bed::isHasVentilator);
        assertThat(saved.values()).anyMatch(Bed::isHasDialysis);
    }

    @Test
    @DisplayName("more than one general bed satisfies the tightest general requirement")
    void severalGeneralBedsSatisfyTheTightestGeneralRequirement() {
        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            beds.add(bed("GEN-" + i, "GENERAL", "General Ward"));
        }

        Map<String, Bed> saved = runAndCapture(beds);

        long fullyEquipped = saved.values().stream()
                .filter(b -> b.isHasOxygen() && b.isHasVentilator() && b.isHasCardiacMonitor())
                .count();
        assertThat(fullyEquipped).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("beds in unrecognised wards are left untouched")
    void unknownWardTypeIsNotModified() {
        Bed unknown = bed("XX-1", "RADIOLOGY", "Imaging");

        org.mockito.Mockito.when(bedRepository.findAll()).thenReturn(List.of(unknown));
        patcher.run();

        verify(bedRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("empty database is a no-op")
    void emptyDatabaseDoesNothing() {
        org.mockito.Mockito.when(bedRepository.findAll()).thenReturn(List.of());

        patcher.run();

        verify(bedRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
    }
}