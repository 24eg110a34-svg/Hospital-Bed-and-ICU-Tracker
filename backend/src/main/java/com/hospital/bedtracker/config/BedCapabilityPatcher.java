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

/**
 * Repairs bed capability flags on every boot.
 *
 * DataInitializer only seeds when the ward table is empty, so a database seeded by an
 * earlier build keeps whatever capabilities that build produced. Those seeds had ICU beds
 * without dialysis and an Isolation Ward with no isolation flag, which made dialysis and
 * isolation patients permanently ineligible for the beds they clinically needed.
 *
 * This runs after the seeders and adjusts flags only, so it is safe to re-run and never
 * touches patient, allocation or bed-status data.
 */
@Component
@Order(2)
public class BedCapabilityPatcher implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BedCapabilityPatcher.class);

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

        int fixed = 0;
        for (Bed bed : beds) {
            if (bed.getWard() == null || bed.getWard().getWardType() == null) {
                continue;
            }
            String wardType = bed.getWard().getWardType().trim().toUpperCase();

            Boolean desiredDialysis = null;
            Boolean desiredIsolation = null;
            Boolean desiredMonitor = null;

            switch (wardType) {
                case "ICU" -> desiredDialysis = Boolean.TRUE;
                case "ISOLATION" -> desiredIsolation = Boolean.TRUE;
                case "CARDIOLOGY" -> {
                    desiredIsolation = Boolean.FALSE;
                    desiredDialysis = Boolean.TRUE;
                    desiredMonitor = Boolean.TRUE;
                }
                default -> { }
            }

            boolean changed = false;
            if (desiredDialysis != null && desiredDialysis != bed.isHasDialysis()) {
                bed.setHasDialysis(desiredDialysis);
                changed = true;
            }
            if (desiredIsolation != null && desiredIsolation != bed.isIsolation()) {
                bed.setIsIsolation(desiredIsolation);
                changed = true;
            }
            if (Boolean.TRUE.equals(desiredMonitor) && !bed.isHasCardiacMonitor()) {
                bed.setHasCardiacMonitor(true);
                changed = true;
            }
            if (changed) {
                bedRepository.save(bed);
                fixed++;
            }
        }

        if (fixed > 0) {
            log.info("BedCapabilityPatcher: repaired capability flags on {} of {} beds", fixed, beds.size());
        } else {
            log.info("BedCapabilityPatcher: all {} beds already had correct capabilities", beds.size());
        }
    }
}