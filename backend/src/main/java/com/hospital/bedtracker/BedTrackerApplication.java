package com.hospital.bedtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BedTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(BedTrackerApplication.class, args);
    }
}
