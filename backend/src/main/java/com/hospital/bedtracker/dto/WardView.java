package com.hospital.bedtracker.dto;

import com.hospital.bedtracker.entity.Ward;

public class WardView {
    private Long id;
    private String name;
    private String location;
    private String wardType;
    private Integer floor;
    private Integer capacity;
    private Long hospitalId;
    private String hospitalName;

    public static WardView from(Ward ward) {
        WardView view = new WardView();
        view.id = ward.getId();
        view.name = ward.getName();
        view.location = ward.getLocation();
        view.wardType = ward.getWardType();
        view.floor = ward.getFloor();
        view.capacity = ward.getCapacity();
        if (ward.getHospital() != null) {
            view.hospitalId = ward.getHospital().getId();
            view.hospitalName = ward.getHospital().getName();
        }
        return view;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getLocation() { return location; }
    public String getWardType() { return wardType; }
    public Integer getFloor() { return floor; }
    public Integer getCapacity() { return capacity; }
    public Long getHospitalId() { return hospitalId; }
    public String getHospitalName() { return hospitalName; }
}
