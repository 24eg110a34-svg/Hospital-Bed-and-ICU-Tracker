package com.hospital.bedtracker.config;

import com.hospital.bedtracker.entity.Ambulance;
import com.hospital.bedtracker.repository.AmbulanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class AmbulanceDataSeeder {
    @Autowired private AmbulanceRepository repository;

    public void seedAmbulances(String hospitalName) {
        if (repository.count() > 0) return;
        create("KA-01-AB-1001", "Ramesh Kumar", "AVAILABLE", "City General Hospital - Bay 1", null, null, hospitalName);
        create("KA-01-AB-1002", "Suresh Singh", "EN_ROUTE", "Whitefield, 6.2 km away", "City General Hospital - Emergency",
                LocalDateTime.now().plusMinutes(12), hospitalName);
        create("KA-01-AB-1003", "Amit Patel", "AVAILABLE", "City General Hospital - Bay 2", null, null, hospitalName);
        create("KA-02-CD-2001", "Vikram Yadav", "TRANSPORTING", "Outer Ring Road, 3.1 km away", "City General Hospital - Emergency",
                LocalDateTime.now().plusMinutes(5), hospitalName);
        create("KA-02-CD-2002", "Anil Desai", "MAINTENANCE", "Workshop - Equipment check", null, null, hospitalName);
        System.out.println("Seeded 5 ambulances");
    }

    private void create(String vehicleNumber, String driver, String status, String location,
                        String destination, LocalDateTime eta, String hospitalName) {
        Ambulance ambulance = new Ambulance();
        ambulance.setVehicleNumber(vehicleNumber);
        ambulance.setDriverName(driver);
        ambulance.setStatus(status);
        ambulance.setCurrentLocation(location);
        ambulance.setDestination(destination);
        ambulance.setEta(eta);
        ambulance.setHospitalName(hospitalName);
        ambulance.setLastUpdated(LocalDateTime.now());
        repository.save(ambulance);
    }
}
