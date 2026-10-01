package com.hospital.bedtracker.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="ambulances")
public class Ambulance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String vehicleNumber;
    private String driverName;
    private String hospitalName;
    private String status; // AVAILABLE, EN_ROUTE, ARRIVED, TRANSPORTING, MAINTENANCE
    private String currentLocation;
    private String destination;
    private LocalDateTime eta;
    private Long patientId;
    private LocalDateTime lastUpdated = LocalDateTime.now();
    public Ambulance(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getVehicleNumber(){return vehicleNumber;} public void setVehicleNumber(String v){vehicleNumber=v;}
    public String getDriverName(){return driverName;} public void setDriverName(String v){driverName=v;}
    public String getHospitalName(){return hospitalName;} public void setHospitalName(String v){hospitalName=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getCurrentLocation(){return currentLocation;} public void setCurrentLocation(String v){currentLocation=v;}
    public String getDestination(){return destination;} public void setDestination(String v){destination=v;}
    public LocalDateTime getEta(){return eta;} public void setEta(LocalDateTime v){eta=v;}
    public Long getPatientId(){return patientId;} public void setPatientId(Long v){patientId=v;}
    public LocalDateTime getLastUpdated(){return lastUpdated;} public void setLastUpdated(LocalDateTime v){lastUpdated=v;}
    public String getAmbulanceId(){ return vehicleNumber; }
    public String getLocation(){ return currentLocation; }
}
