package com.hospital.bedtracker.config;

import com.hospital.bedtracker.entity.Bed;
import com.hospital.bedtracker.repository.BedRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Establishes a realistic bed capability matrix on every boot.
 *
 * DataInitializer only seeds when the ward table is empty, so a database seeded by an
 * earlier build keeps whatever capabilities that build produced. Those seeds gave ICU beds
 * no dialysis, left the Isolation Ward with no isolation flag, and gave the General Ward no
 * oxygen at all. Because a bed missing a capability the patient requires is a hard blocker,
 * those gaps made whole classes of patient permanently ineligible.
 *
 * This runs after the seeders and rewrites capability flags to match the matrix below. It
 * is idempotent, sets absolute values rather than toggling, and touches capability columns
 * only, so patient, allocation and bed-status data is never affected.
 */
@Component
@Order(2)
public class BedCapabilityPatcher implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BedCapabilityPatcher.class);

    /** ICU rooms set up for isolation, as every hospital with an isolation ICU provides. */
    private static final Set<Integer> ISOLATION_ICU = Set.of(1, 6);

    /** General-ward beds with a portable ventilator and a cardiac monitor. */
    private static final Set<Integer> GENERAL_VENTILATOR = Set.of(2, 9, 11);
    private static final Set<Integer> GENERAL_CARDIAC = Set.of(2, 7, 9, 11);

    /** Dialysis machines are portable and are sited on acute as well as critical wards. */
    private static final Set<Integer> DIALYSIS_GENERAL = Set.of(3, 8, 12);

    private final BedRepository bedRepository;

    public BedCapabilityPatcher(BedRepository bedRepository) {
        this.bedRepository = bedRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<Bed> beds = bedRepository.findAll();
        if (beds.isEmpty()) {
            log.info("BedCapabilityPatcher: no beds present, nothing to repair");
            return;
        }

        int changed = 0;
        for (Bed bed : beds) {
            if (bed.getWard() == null || bed.getWard().getWardType() == null) {
                continue;
            }
            String wardType = bed.getWard().getWardType().trim().toUpperCase();
            int n = ordinalOf(bed.getBedNumber());

            boolean ventilator = false;
            boolean cardiac = false;
            boolean oxygen = false;
            boolean isolation = false;
            boolean dialysis = false;

            switch (wardType) {
                case "ICU" -> {
                    ventilator = true;
                    cardiac = true;
                    oxygen = true;
                    dialysis = true;
                    isolation = ISOLATION_ICU.contains(n);
                }
                case "CARDIOLOGY" -> {
                    oxygen = true;
                    cardiac = true;
                    dialysis = true;
                }
                case "HDU" -> {
                    oxygen = true;
                    cardiac = true;
                    ventilator = n % 3 == 1;
                    dialysis = n % 3 == 2;
                }
                case "EMERGENCY" -> {
                    oxygen = true;
                    cardiac = n % 2 == 1;
                    ventilator = n % 4 == 1;
                }
                case "ISOLATION" -> {
                    oxygen = true;
                    isolation = true;
                }
                case "GENERAL" -> {
                    oxygen = n % 5 != 0;
                    ventilator = GENERAL_VENTILATOR.contains(n);
                    cardiac = GENERAL_CARDIAC.contains(n);
                    dialysis = DIALYSIS_GENERAL.contains(n);
                }
                case "SURGERY" -> {
                    oxygen = true;
                    cardiac = n % 3 == 1;
                }
                case "PEDIATRICS" -> {
                    oxygen = n % 3 != 0;
                }
                default -> { }
            }

            boolean dirty = false;
            if (bed.isHasVentilator() != ventilator) {
                bed.setHasVentilator(ventilator);
                dirty = true;
            }
            if (bed.isHasCardiacMonitor() != cardiac) {
                bed.setHasCardiacMonitor(cardiac);
                dirty = true;
            }
            if (bed.isHasOxygen() != oxygen) {
                bed.setHasOxygen(oxygen);
                dirty = true;
            }
            if (bed.isIsolation() != isolation) {
                bed.setIsIsolation(isolation);
                dirty = true;
            }
            if (bed.isHasDialysis() != dialysis) {
                bed.setHasDialysis(dialysis);
                dirty = true;
            }

            if (dirty) {
                bedRepository.save(bed);
                changed++;
            }
        }

        log.info("BedCapabilityPatcher: capability matrix applied, {} of {} beds updated", changed, beds.size());
    }

    private int ordinalOf(String bedNumber) {
        if (bedNumber == null) {
            return 0;
        }
        int dash = bedNumber.lastIndexOf('-');
        if (dash < 0 || dash == bedNumber.length() - 1) {
            return 0;
        }
        try {
            return Integer.parseInt(bedNumber.substring(dash + 1));
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}